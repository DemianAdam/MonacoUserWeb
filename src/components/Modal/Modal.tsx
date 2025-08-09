import React, { useRef, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import ReactDOM from 'react-dom';
import './Modal.css';

export default function Modal({ show, onHide, children }) {
    const nodeRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                contentRef.current &&
                !contentRef.current.contains(event.target)
            ) {
                onHide(); // Close on outside click
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [show, onHide]);

    const modal = (
        <CSSTransition
            in={show}
            timeout={300}
            classNames="modal"
            unmountOnExit
            nodeRef={nodeRef}
        >
            <div
                ref={nodeRef}
                className="fixed top-0 left-0 w-full h-full bg-black/70 flex justify-center items-center z-50"
            >
                <div ref={contentRef} className="bg-black m-10 rounded-2xl">
                    <div className="bg-white/5 p-5 flex flex-col text-xl rounded-2xl border-white/30 border shadow-md shadow-white/30">
                        {children}
                    </div>
                </div>
            </div>
        </CSSTransition>
    );

    return ReactDOM.createPortal(modal, document.body);
}
