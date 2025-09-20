// services/scanner.ts
import { Html5Qrcode, Html5QrcodeResult, Html5QrcodeSupportedFormats } from "html5-qrcode";

// iOS detection
const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);

async function unlockIOSCamera() {
    if (!isIOS) return;

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.width = 1; // tiny but visible
    video.height = 1;
    document.body.appendChild(video);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
        });
        video.srcObject = stream;
        await video.play();
        stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
        console.warn("Failed to unlock iOS camera", err);
    } finally {
        video.remove();
    }
}

async function getBackCameraDeviceId(): Promise<string | null> {
    try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) return null;
        const backCamera = devices.find((c) => /back|environment/i.test(c.label));
        return backCamera?.id ?? devices[0].id;
    } catch (err) {
        console.warn("Failed to enumerate cameras", err);
        return null;
    }
}

export async function startScanner({
    elementId,
    onSuccess,
    onFinish,
}: {
    elementId: string;
    onSuccess: (decodedResult: string) => Promise<void>;
    onFinish?: () => void;
}): Promise<Html5Qrcode> {
    await unlockIOSCamera(); // unlock iOS camera

    const scanner = new Html5Qrcode(elementId);
    const cameraId = await getBackCameraDeviceId();
    if (!cameraId) throw new Error("No camera found");

    return new Promise<Html5Qrcode>(async (resolve, reject) => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const stopAndCleanUp = async () => {
            clearTimeout(timeoutId);
            await scanner.stop();
            scanner.clear();
            onFinish?.();
        };

        try {
            await scanner.start(
                { deviceId: { exact: cameraId } }, // use explicit back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    aspectRatio: 9 / 16,
                    videoConstraints: {
                        advanced: [{ focusMode: "continuous" }, { facingMode: "environment" }, { zoom: 3 }], // autofocus
                    },

                },
                async (decodedText: string, decodedResult: Html5QrcodeResult) => {
                    await stopAndCleanUp();
                    try {
                        validate(decodedResult);
                    } catch (error) {
                        reject(error);
                        return;
                    }
                    await onSuccess(decodedText);
                    resolve(scanner);
                },
                () => { }
            );

            // ✅ Try to "kick" autofocus again after 2 seconds
            setTimeout(async () => {
                let stream: MediaStream | null = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" },
                    });
                    const track = stream.getVideoTracks()[0];
                    await track.applyConstraints({
                        advanced: [
                            { focusMode: "continuous" },
                            { zoom: 3 },
                            { facingMode: "environment" }, // optional
                        ],
                    });
                } catch (err) {
                    console.warn("Failed to reapply focus:", err);
                }
                finally {
                    if (stream) {
                        stream.getTracks().forEach((t) => t.stop()); // ✅ release camera
                    }
                }
            }, 2000);

            // Timeout after 15s
            timeoutId = setTimeout(async () => {
                await stopAndCleanUp();
                reject(new Error("Scanner timeout: No QR code detected within 15 seconds."));
            }, 15000);

            // iOS video patch
            const videoEl = document.querySelector(
                `#${elementId} video`
            ) as HTMLVideoElement | null;
            if (videoEl) {
                videoEl.setAttribute("autoplay", "");
                videoEl.setAttribute("muted", "");
                videoEl.setAttribute("playsinline", "");
            }
        } catch (err) {
            reject(err);
            await stopAndCleanUp();
        }
    });
}

export async function stopScanner(scanner: Html5Qrcode | null) {
    if (scanner) {
        await scanner.stop();
        scanner.clear();
    }
}

function validate(scanResult: Html5QrcodeResult) {
    const validFormats: Html5QrcodeSupportedFormats[] = [
        Html5QrcodeSupportedFormats.PDF_417,
        // Html5QrcodeSupportedFormats.QR_CODE,
    ];

    if (!scanResult) throw new Error("Invalid scan result: Scan result is null or undefined.");
    if (!validFormats.find((x) => x == scanResult.result.format?.format)) {
        throw new Error(`Invalid scan result: Unsupported format ${scanResult.result.format}.`);
    }
}
export const handleFileScan = async (
    file: File,
    elementId: string,
    onSuccess: (decodedText: string) => void,
    onError?: (errorMessage: string) => void
) => {
    const scanner = new Html5Qrcode("file-reader");

    scanner
        .scanFileV2(file, true)
        .then((decodedResult) => {
            try {
                validate(decodedResult);
                onSuccess(decodedResult.decodedText);
            } catch (error: any) {
                onError?.(error.message);
            }
            scanner.clear();
        })
        .catch((err) => {
            onError?.(err.message);
            scanner.clear();
        });
    return scanner;
};
