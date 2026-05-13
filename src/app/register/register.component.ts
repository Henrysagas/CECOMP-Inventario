import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, NonNullableFormBuilder, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { LogVisitaService } from '../services/log-visita.service';
import { RolUsuario } from '../models/rol-usuario';
import { RolUsuarioService } from '../services/rol-usuario.service';

// Validador personalizado para contraseñas coincidentes
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  roles: RolUsuario[] = [];
  cargandoRoles = false;

  registerForm: FormGroup = this.fb.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    cargo: ['', [Validators.required]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    userName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    estado: ['Activo', Validators.required],  // Valor por defecto "Activo"
    rol: [null, Validators.required],
  });

  constructor(
    private fb: NonNullableFormBuilder,
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService,
    private logVisitaService: LogVisitaService,
    private rolUsuarioService: RolUsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.cargandoRoles = true;
    this.rolUsuarioService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        const rolAdministrador = roles.find(rol => this.normalizarTexto(rol.NOMBRE_ROL).includes('admin'));
        const rolInicial = rolAdministrador ?? roles[0];

        if (rolInicial) {
          this.registerForm.get('rol')?.setValue(rolInicial.ID_ROL_USUARIO);
        }

        this.cargandoRoles = false;
      },
      error: () => {
        this.cargandoRoles = false;
        this.message.error('Error al cargar los roles de usuario');
      }
    });
  }

  submitForm(): void {
    if (this.registerForm.valid) {
      const { nombres, apellidos, cargo, dni, userName, password, rol } = this.registerForm.value;
      const rolId = Number(rol);

      this.authService.register(nombres, apellidos, userName, dni, "Activo", cargo, password, rolId).subscribe({
        next: (response) => {
          this.logVisitaService.registrarAccion('agregar usuario', '/register', {
            usuario_id: response?.user?.id ?? response?.id,
            usuario: userName,
            rol_id: rolId
          }).subscribe();
          this.message.success('Registro exitoso');
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          console.error('Registro fallido', err);
        
          // Detallar más información si el error es un objeto con detalles
          if (err && err.error) {
            console.error('Detalles del error:', err.error);
            
            // Si el error tiene detalles específicos (por ejemplo, mensajes de validación), mostrarlos
            if (err.error.errors) {
              // Aquí se muestra el detalle de los errores de validación
              for (const field in err.error.errors) {
                if (err.error.errors.hasOwnProperty(field)) {
                  console.error(`${field}: ${err.error.errors[field]}`);
                  this.message.error(`Error en el campo ${field}: ${err.error.errors[field]}`);
                }
              }
            } else {
              this.message.error('Error desconocido. Por favor, intente nuevamente.');
            }
          }
        
          if (err && err.status) {
            console.error('Código de estado:', err.status);
          }
          
          if (err && err.message) {
            console.error('Mensaje del error:', err.message);
          }
        
          // Mensaje genérico de error
          if (err.status === 400) {
            this.message.error('Datos inválidos. Verifica los campos e intenta de nuevo.');
          } else if (err.status === 422) {
            this.message.error('Algunos campos son incorrectos. Por favor, revisa los errores detallados.');
          } else if (err.status === 500) {
            this.message.error('Error interno del servidor. Intenta más tarde.');
          } else {
            this.message.error('Ocurrió un error durante el registro');
          }
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  limitarDni(event: Event): void {
    const input = event.target as HTMLInputElement;
    const dni = input.value.replace(/\D/g, '').slice(0, 8);
    input.value = dni;
    this.registerForm.get('dni')?.setValue(dni, { emitEvent: false });
  }

  volverUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '').trim().toLowerCase();
  }
}
