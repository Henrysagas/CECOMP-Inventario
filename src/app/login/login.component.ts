// login.component.ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageService } from 'ng-zorro-antd/message'; // Importar NzMessageService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    NzGridModule
  ],
  template: ` <label nz-checkbox [(ngModel)]="checked">Checkbox</label> `,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  validateForm: FormGroup<{
    userName: FormControl<string>;
    password: FormControl<string>;
    remember: FormControl<boolean>;
  }> = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]],
    remember: [true],  // Asegúrate de que esté aquí
  });

  constructor(
    private fb: NonNullableFormBuilder,
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService // Inyectar NzMessageService
    
  ) {}

  submitForm(): void {
    if (this.validateForm.valid) {
      const userName = this.validateForm.get('userName')?.value;
      const password = this.validateForm.get('password')?.value;
      if (userName && password) {
        this.authService.login(userName, password).subscribe({
          next: (res) => {
            this.router.navigate(['/verbienes']); // Redirige a la página Welcome
          },
          error: (err) => {
            console.error('Login failed', err);
            // Mostrar mensaje de error
            this.message.error('Usuario o contraseña incorrectos'); // Mensaje de error
          }
        });
      } else {
        console.error('Usuario o contraseña están vacíos');
      }
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
    
  }

}
