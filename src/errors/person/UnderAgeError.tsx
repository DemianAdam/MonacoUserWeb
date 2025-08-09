import IBaseError from '../IBaseError'
class UnderAgeError implements IBaseError {
    age: number;
    code: string = "UnderAge";s
    get message() {
        return `La persona es menor a ${this.age} años`;
    }
    constructor(age: number) {
        this.age = age;
    }

}


export default UnderAgeError;