import React from 'react'
import Person from '../../models/person'

export default function PersonModalContent({ person }: { person: Person }) {
    return (
        <div>
            <h2>Nombre: {person.name} {person.lastname}</h2>
            <p>DNI: {person.dni}</p>
            <p>Fecha de nacimiento: {new Date(person.birthdate).toLocaleDateString()}</p>
        </div>
    )
}
