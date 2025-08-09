// services/scanner.ts
import { Html5Qrcode, Html5QrcodeResult, Html5QrcodeSupportedFormats } from "html5-qrcode";

export async function startScanner({
    elementId,
    onSuccess,
    onFinish,
}: {
    elementId: string;
    onSuccess: (decodedResult: string) => Promise<void>;
    onFinish?: () => void;
}): Promise<Html5Qrcode> {
    //const hasPermission = await requestCameraPermission();
    const scanner = new Html5Qrcode(elementId);

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
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    videoConstraints: {
                        advanced: [
                            { focusMode: "continuous" },
                            { zoom: 3 },
                            { facingMode: "environment" },
                        ],
                    },
                    aspectRatio: 9 / 16,
                },
                async (decodedText: string, decodedResult: Html5QrcodeResult) => {
                    await stopAndCleanUp();

                    try {
                        validate(decodedResult);
                    } catch (error) {
                        reject(error);
                    }

                    onSuccess(decodedText);
                    
                    resolve(scanner); // ✅ Resolve on success
                },
                () => {
                    // Optional error handler
                    
                }
            );

            // ✅ Reject the promise on timeout
            timeoutId = setTimeout(async () => {
                await stopAndCleanUp();
                reject(new Error("Scanner timeout: No QR code detected within 15 seconds."));
            }, 15000);
        } catch (err) {
            reject(err);
            await stopAndCleanUp();
            
        }
    });
}

export const handleFileScan = async (file: File, elementId: string, onSuccess: (decodedText: string) => void, onError?: (errorMessage: string) => void) => {
    const scanner = new Html5Qrcode(/* you can use an arbitrary ID */ "file-reader");

    scanner.scanFileV2(file, true).then((decodedResult) => {

        try {
            validate(decodedResult);
            onSuccess(decodedResult.decodedText);
        } catch (error) {
            onError?.(error.message);
        }

        scanner.clear();
    }).catch((err) => {
        onError?.(err.message);
        // scanner.stop();
        scanner.clear();
    });
    return scanner;
};

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

    if (!scanResult) {
        throw new Error("Invalid scan result: Scan result is null or undefined.");
    }
    if (!validFormats.find((x) => x == scanResult.result.format?.format)) {
        throw new Error(`Invalid scan result: Unsupported format ${scanResult.result.format}.`);
    }
}

async function requestCameraPermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true; // Permission granted
    } catch (err: any) {

        const errorObj = {
            code: err.name,
            message: ""
        }
        if (err.name === "NotAllowedError") {
            errorObj.message = "No se puede acceder a la camara. Para continuar, permitalo desde la configuracion del navegador."
            throw errorObj;
        } else if (err.name === "NotFoundError") {
            errorObj.message = "Camara no encontrada."
            throw errorObj;
        } else {
            console.error("Camera permission error:", err);
        }
        return false;
    }
}



