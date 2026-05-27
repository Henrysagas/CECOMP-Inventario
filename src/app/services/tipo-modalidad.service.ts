import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoModalidad } from '../models/tipo-modalidad';

@Injectable({
    providedIn: 'root'
})
export class TipoModalidadService {
    private apiUrl = `${API_BASE_URL}/tipo-modalidad`; // Cambia esta URL según tu API

    constructor(private http: HttpClient) {}

    getTiposModalidad(): Observable<TipoModalidad[]> {
        return this.http.get<TipoModalidad[]>(this.apiUrl);
    }
}
