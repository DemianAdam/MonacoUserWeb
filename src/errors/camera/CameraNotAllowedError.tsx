import IBaseError from '../IBaseError'
class CameraNotAllowedError implements IBaseError{
    code: string = "NotAllowed";
    message: string = "No se puede acceder a la camara. Para continuar, permitalo desde la configuracion del navegador.";

}