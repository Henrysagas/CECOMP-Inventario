import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoModalidad } from '../models/tipo-modalidad';

@Injectable({
    providedIn: 'root'
})
export class TipoModalidadService {
    private apiUrl = 'http://localhost:8000/api/tipo-modalidad'; // Cambia esta URL según tu API

    constructor(private http: HttpClient) {}

    getTiposModalidad(): Observable<TipoModalidad[]> {
        return this.http.get<TipoModalidad[]>(this.apiUrl);
    }
}
