import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    <div class="users-container">
      <h1>Users</h1>
      <p>Welcome to the Users component</p>
    </div>
  `,
  styles: [
    `
      .users-container {
        padding: 20px;
      }
    `,
  ],
})
export class Users {}
