import Person from "../../models/person";
export function pdf417ToPerson(rawData: string): Person {
    if (!rawData) {
        throw new Error("Invalid raw data: Data is null or empty.");
    }
    const parts = rawData.split("@");
    if (parts.length != 9) {
        throw new Error("Invalid raw data: Unexpected format.");
    }
    const dni = Number(parts[4]);
    const name = parts[2];
    const lastname = parts[1];
    const [day, month, year] = parts[6].split("/");

    const birthdate = new Date( parseInt(year),parseInt(month) - 1,parseInt(day));
    return { dni, name, lastname, birthdate, rawData };
}