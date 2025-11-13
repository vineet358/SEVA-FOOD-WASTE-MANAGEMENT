# Authentication System

## Overview
A comprehensive authentication system for the SEWA Food Portal that supports three user types: Individual, NGO, and Hotel.

## Features

### User Types
1. **Individual**: Personal food donors
   - Simple registration with name, email, phone, password
   - Easy login process

2. **NGO**: Non-profit organizations
   - Organization name, contact person, address, license number
   - Document upload capability
   - Enhanced verification process

3. **Hotel**: Hotels and restaurants
   - Hotel name, contact person, address, license number
   - Document upload capability
   - Business verification

### Authentication Features
- **Login/Register Toggle**: Smooth transitions between login and registration
- **User Type Selection**: Visual cards for selecting user type during registration
- **Form Validation**: Real-time validation with error messages
- **Password Visibility Toggle**: Show/hide password functionality
- **Remember Me**: Checkbox for persistent login
- **File Upload**: Support for document uploads (NGOs and Hotels)
- **Responsive Design**: Works on desktop and mobile devices
- **Animated Transitions**: Smooth UI animations and transitions
- **Success States**: Visual feedback for successful operations

### Form Fields

#### Common Fields (All Users)
- Email (required, validated)
- Password (required, min 6 characters)
- Phone (required for registration)

#### Individual Specific
- Full Name (required)

#### NGO Specific
- Organization Name (required)
- Contact Person (required)
- Address (required)
- License Number (required)
- Documents (optional)

#### Hotel Specific
- Hotel Name (required)
- Contact Person (required)
- Address (required)
- License Number (required)
- Documents (optional)

### Validation Rules
- Email format validation
- Password minimum length (6 characters)
- Password confirmation matching
- Required field validation
- Real-time error clearing

### UI/UX Features
- Modern gradient design
- Smooth animations and transitions
- Responsive grid layouts
- Accessible form controls
- Loading states with spinners
- Success feedback
- Error handling with clear messages

## Usage

```jsx
import AuthSystem from './components/Auth/AuthSystem';

// Use in your component
<AuthSystem />
```

## Styling
The authentication system uses CSS custom properties for theming and includes:
- Responsive breakpoints
- Accessibility features
- Reduced motion support
- High contrast mode support

## File Structure
```
components/Auth/
├── AuthSystem.jsx      # Main authentication component
├── AuthSystem.css      # Styling for the auth system
└── README.md          # This documentation
```

