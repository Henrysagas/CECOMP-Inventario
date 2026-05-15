import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UsuarioService } from '../services/usuario.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

// Enum para roles
export enum Rol {
  Administrador = 1,
  Usuario = 2
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  standalone: true,
  imports: [
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzTabsModule,
    NzGridModule
  ]
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  passwordForm!: FormGroup;
  userData: any = null;
  loading: boolean = false;
  userId: number | null = null; // ID del usuario logueado
  rolLabel: string = ''; // Texto del rol

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('id'));
    console.log(Number(localStorage.getItem('id')));
    if (!this.userId) {
      this.message.error('No se encontró el ID del usuario.');
      return;
    }

    this.initForms();
    this.loadUserData();
  }

  initForms(): void {
    this.perfilForm = this.fb.group({
  nombres: [{ value: '', disabled: true }],
  apellidos: [{ value: '', disabled: true }],
  usuario: [{ value: '', disabled: true }],
  rol: [{ value: '', disabled: true }],
  dni: [{ value: '', disabled: true }],
  estado: [{ value: '', disabled: true }], // Agregar control para estado
  cargo: [{ value: '', disabled: true }],
    });
    this.perfilForm.disable(); // Deshabilitar todo el formulario inicialmente

    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validator: this.passwordsMatch }
    );
  }

  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  loadUserData(): void {
    this.loading = true;

    this.usuarioService.getUserProfile(this.userId!).subscribe({
      next: (data) => {
        this.userData = data;
        this.perfilForm.patchValue({
          nombres: data.NOMBRES,
          apellidos: data.APELLIDOS,
          usuario: data.USU,
          rol: data.ID_ROL,
          dni: data.dni,
          estado: data.estado, // Asegúrate de incluir el estado aquí
          cargo: data.cargo,
        });
        this.setRolLabel(data.ID_ROL); // Si necesitas el label del rol
        this.loading = false;
      },
      error: () => {
        this.message.error('Error al cargar los datos del usuario.');
        this.loading = false;
      }
    });
  }

  setRolLabel(rol: Rol): void {
    this.rolLabel = rol === Rol.Administrador ? 'Administrador' : 'Usuario';
  }

  updateUser(): void {
    if (this.perfilForm.invalid) {
      this.message.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    const updatedData = this.perfilForm.getRawValue();
    this.loading = true;

    this.usuarioService.updateUsuario(this.userId!, updatedData).subscribe({
      next: () => {
        this.message.success('Datos actualizados correctamente.');
        this.loading = false;
      },
      error: () => {
        this.message.error('Error al actualizar los datos.');
        this.loading = false;
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.message.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    const { oldPassword, newPassword } = this.passwordForm.value;
    this.loading = true;

    this.usuarioService.updatePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.message.success('Contraseña actualizada con éxito.');
        this.passwordForm.reset();
        this.loading = false;
      },
      error: () => {
        this.message.error('Error al actualizar la contraseña. Verifica los datos.');
        this.loading = false;
      }
    });
  }
}
