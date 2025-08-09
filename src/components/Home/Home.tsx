import { Html5Qrcode, Html5QrcodeResult } from "html5-qrcode";
import { useState, useEffect, useRef, ReactNode } from "react";
import { useModal } from "../Modal/ModalContext";
import { startScanner, stopScanner, handleFileScan } from "../../services/scanner/scanner";
import { createPerson } from "../../services/person/personService";
import PersonModalContent from "../Person/PersonModalContent";
import DniErrorModalContent from "../Errors/DniErrorModalContent";
import UnderAgeErrorModalContent from "../Errors/UnderAgeErrorModalContent"
import DateLimitReachedErrorModalContent from '../Errors/DateLimitReachedModalContent'
import ListLimitReachedModalContext from '../Errors/ListLimitReachedModalContext'
import UnderAgeError from "../../errors/person/UnderAgeError";

export default function Home() {
    const { showModal, hideModal } = useModal();
    const [cameraScanning, setCameraScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerRef = useRef<HTMLDivElement | null>(null);

    // Show modal first
    const handleClickCameraScanner = () => {
        showModal(instructionsModalContent);
    };

    const handleClickFileScanner = (e) => {
        const fileInput = document.getElementById("files") as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            handleFileScan(file,
                "id-file-reader",
                scanSuccess,
                (error: string) => {
                    console.error(`File scan error: ${error}`);
                    showModal(errorModalContent(null));
                }
            )
        };
        e.target.value = "";
    }

    // When user accepts the modal
    const handleModalAccept = () => {
        hideModal();
        setCameraScanning(true);
    };



    const scanSuccess = async (decodedResult: string) => {
        setIsLoading(true);
        try {
            const data = await createPerson(decodedResult);
            showModal(sucessModalContent(<PersonModalContent person={data} />));
        } catch (error: any) {
            if (error instanceof UnderAgeError || error.code == "UnderAge") {
                showModal(errorModalContent(<UnderAgeErrorModalContent />))
            }
            else if (error.code === 'UniqueError') {
                showModal(sucessModalContent(<DniErrorModalContent />));
            } else if (error.code == "DateLimitReached") {
                showModal(errorModalContent(<DateLimitReachedErrorModalContent />))
            } else if (error.code == "ListLimitReached") {
                showModal(errorModalContent(<ListLimitReachedModalContext />))
            } else {
                showModal(errorModalContent(null))
            }
        }
        finally {
            setIsLoading(false);
        }
    }

    // Scanner initialization
    useEffect(() => {
        const run = async () => {
            if (!readerRef.current || scannerRef.current) return;
            try {
                const scanner = await startScanner({
                    elementId: readerRef.current.id,
                    onSuccess: scanSuccess,
                    onFinish: () => {
                        scannerRef.current = null;
                        setCameraScanning(false);
                    },
                });


                scannerRef.current = scanner;
            } catch (error) {
                let message: string | undefined;
                if (error.includes("NotAllowedError")) {
                    message = "No se puede acceder a la camara. Para continuar, permitalo desde la configuracion del navegador."
                }
                else if (error.includes("NotFoundError")) {
                    message = "Camara no encontrada."
                }
                else {
                    message = undefined;
                }
                console.log(error)
                showModal(errorModalContent(message && <div>{message}</div>))

                setCameraScanning(false);
            }

        };

        if (cameraScanning) {
            run();
        }

        return () => {
            stopScanner(scannerRef.current);
            scannerRef.current = null;
        };
    }, [cameraScanning]);

    const instructionsModalContent = (
        <div className="text-center">
            <p>Tenés que escanear el QR de tu DNI:</p>
            <img src="/images/dni.png" className="mx-auto my-4" />
            <button
                onClick={handleModalAccept}
                className="px-4 py-2 m-2 bg-green-600 text-white rounded"
            >
                Aceptar
            </button>
            <button
                onClick={hideModal}
                className="px-4 py-2 m-2 bg-red-500 text-white rounded"
            >
                Cancelar
            </button>
        </div>
    );

    const sucessModalContent = (element: ReactNode) => (
        <div className="text-center">
            <p>¡QR Verificado!</p>
            {element}
            <button
                onClick={hideModal}
                className="px-4 py-2 m-2 bg-blue-600 text-white rounded"
            >
                Cerrar
            </button>
        </div>
    );

    const errorModalContent = (element: ReactNode | null | undefined) => (
        <div className="text-center">
            {element || (
                <>
                    <p>Error al escanear el DNI. Asegurese que el QR se vea bien.</p>
                    <img src="/images/dni.png" className="mx-auto my-4" />
                </>
            )}
            <button
                onClick={hideModal}
                className="px-4 py-2 m-2 bg-red-500 text-white rounded"
            >
                Cerrar
            </button>
        </div>
    );

    const scanButtons =
        (
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleClickCameraScanner}
                    className="px-10 py-3 border-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] bg-[#d63e3e]/20 text-white rounded-3xl hover:bg-blue-600"
                >
                    Escanear DNI
                </button>

                <label htmlFor={"files"} className="btn px-10 py-3 border-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] bg-[#d63e3e]/20 text-white rounded-3xl hover:bg-blue-600">Escanear Imagen</label>
                <input onChange={handleClickFileScanner} id="files" className="hidden" type="file" accept="image/*" />
            </div>
        );

    return (
        <div className="flex flex-col border bg-black/15 border-black/30 shadow-md shadow-black rounded-2xl p-5 text-white h-[95%] mx-5 justify-center">
            <div className="flex flex-col h-full py-5 items-center font-serif text-center font-[10]">
                <h2 className="text-3xl mb-5 tracking-wide">¡Bienvenido a Mónaco!</h2>
                <div className="flex mt-7 flex-col items-center justify-between">
                    <p className="text-md mb-7 tracking-normal">
                        Escaneá tu DNI para sumarte a nuestra lista!
                    </p>

                    {cameraScanning && <div id="reader" ref={readerRef} className="w-full h-full"></div>}

                    {isLoading && <div className="loader"></div>}

                    {!cameraScanning && !isLoading && scanButtons}

                    <div id="file-reader" className="hidden" />
                </div>
                <p className="mt-auto text-sm text-gray-500">
                    Asegúrate de que tu cámara esté habilitada y el DNI sea legible.
                </p>
            </div>
        </div>
    );
}
