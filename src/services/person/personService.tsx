import axios from '../axios/axios';
import Person from '../../models/person';
import { pdf417ToPerson } from './personMapper';
import UnderAgeError from '../../errors/person/UnderAgeError';

export const createPerson = async (decodedText: string): Promise<Person> => {
    const person = pdf417ToPerson(decodedText);
    console.log(person);
    return await addPerson(person);
}

const addPerson = async (person: Person): Promise<Person> => {

    const age = calculateAge(person.birthdate)

    if (age < 18) {
        throw new UnderAgeError(age);
    }

    const requestObj = {
        endpoint: '/qrPerson/add',
        data: {
            person
        }
    };

    const response = await axios.post('', JSON.stringify(requestObj));
    return response.data.person;
}

function calculateAge(birthDate: Date) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}
