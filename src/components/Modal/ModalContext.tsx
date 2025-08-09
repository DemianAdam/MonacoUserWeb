import { createContext, useContext, useState, useCallback } from "react";
import Modal from "./Modal";

const ModalContext = createContext({
  showModal: (content: React.ReactNode) => {},
  hideModal: () => {}
});

export function useModal() {
    return useContext(ModalContext);
}

export function ModalProvider({ children }) {
    const [modalContent, setModalContent] = useState(null);
    const [isShown, setIsShown] = useState(false);

    const showModal = useCallback((content) => {
        setModalContent(content);
        setIsShown(true);
    }, []);

    const hideModal = useCallback(() => {
        setIsShown(false);
        setModalContent(null);
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            <Modal show={isShown} onHide={hideModal}>
                {modalContent}
            </Modal>
        </ModalContext.Provider>
    );
}
