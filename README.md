# 🚗 Car Garage Management System

A modern, full-stack web application for managing car garage operations, built with React, Ant Design, Node.js, Express, and PostgreSQL.

## 📋 Features

- **Dashboard**: Overview of business statistics and recent work orders
- **Client Management**: Add, edit, and track client information
- **Car Management**: Manage vehicles with search by plate number
- **Employee Management**: Track mechanics and staff
- **Work Orders**: Create and manage service orders with:
  - Bill number tracking
  - Start and end date/time
  - Service itemization
  - Automatic cost calculation
  - Status tracking (In Progress / Completed)
- **Service History**: View complete service history for each vehicle

## 🛠️ Tech Stack

### Frontend

- **React** - UI framework
- **Ant Design (antd)** - Professional UI components
- **React Router** - Navigation
- **Axios** - API requests
- **Day.js** - Date formatting
- **Vite** - Build tool

### Backend

- **Node.js & Express** - REST API server
- **PostgreSQL (pg)** - Database
- **CORS** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Setup Steps

1. **Clone or navigate to the project directory**

   ```powershell
   cd "C:\Users\Kristi Papallazo\workspace\enigne-file-app"
   ```

2. **Install dependencies** (if not already done)

   ```powershell
   npm install
   ```

3. **Set up your `.env` file with PostgreSQL credentials:**

   ```env
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=garage
   ```

4. **The database tables will be created automatically on first run**

## 🚀 Running the Application

### Development Mode

Start both frontend and backend simultaneously:

```powershell
npm run dev
```

This will start:

- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:5173

### Individual Commands

Run backend only:

```powershell
npm run server
```

Run frontend only:

```powershell
npm run client
```

## 📖 Usage Guide

### 1. **Set Up Your Business**

First, add your employees, clients, and their vehicles:

1. Go to **Employees** and add your mechanics/staff
2. Go to **Clients** and add customer information
3. Go to **Cars** and register vehicles for each client

### 2. **Create Work Orders**

1. Click **Work Orders** → **Create Work Order**
2. Select the car (this auto-fills the client)
3. Assign an employee
4. Set start date/time
5. Click **Create**

### 3. **Add Services to Work Order**

1. Open a work order by clicking **View Details**
2. Click **Add Service**
3. Enter service description, quantity, and unit price
4. The total is calculated automatically
5. Add as many services as needed

### 4. **Complete Work Order**

1. When work is finished, click **Complete Work Order**
2. Set the end date/time
3. Add any final notes
4. The bill is ready with total cost

### 5. **Search & Track**

- Search cars by **plate number** in the Cars page
- View **service history** for any vehicle
- Filter work orders by **status** (In Progress/Completed)
- View **dashboard** for quick statistics

## 🗂️ Database Schema

The system uses the following tables:

- **clients**: Customer information (name, phone, email, address)
- **cars**: Vehicle records (plate, brand, model, year)
- **employees**: Staff members (name, phone, role)
- **work_orders**: Service bills (bill number, dates, status, total cost)
- **services**: Individual service items in each work order

All tables have proper foreign key relationships and cascading deletes.

## 📱 API Endpoints

### Clients

- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client with cars
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Cars

- `GET /api/cars` - Get all cars
- `GET /api/cars/:id` - Get car with history
- `GET /api/cars/search/:plate` - Search by plate
- `POST /api/cars` - Create car
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car

### Employees

- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Work Orders

- `GET /api/work-orders` - Get all work orders
- `GET /api/work-orders/:id` - Get work order with services
- `POST /api/work-orders` - Create work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

### Services

- `GET /api/services/work-order/:workOrderId` - Get services for work order
- `POST /api/services` - Add service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

## 🔧 Configuration

Edit `.env` file to configure:

```env
PORT=3001
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=garage
```

## 📁 Project Structure

```
enigne-file-app/
├── server/                 # Backend code
│   ├── database/
│   │   └── init.js        # Database initialization
│   ├── routes/            # API routes
│   │   ├── clients.js
│   │   ├── cars.js
│   │   ├── employees.js
│   │   ├── workOrders.js
│   │   └── services.js
│   └── index.js           # Express server
├── src/                   # Frontend code
│   ├── api/
│   │   └── index.js       # API client
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Clients.jsx
│   │   ├── Cars.jsx
│   │   ├── Employees.jsx
│   │   ├── WorkOrders.jsx
│   │   └── WorkOrderDetail.jsx
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
└── package.json           # Dependencies
```

## 🎨 Features Walkthrough

### Dashboard

- Quick statistics: total clients, cars, employees, active work orders
- Recent work orders table

### Clients Page

- Add/Edit/Delete clients
- View client details with their vehicles
- Search and sort functionality

### Cars Page

- Register new vehicles
- Search by plate number
- Link cars to owners
- View service history

### Employees Page

- Manage staff members
- Track roles (Mechanic, Manager, etc.)

### Work Orders Page

- Create new work orders
- View all past and current orders
- Filter by status
- Sort by date

### Work Order Details

- View complete work order information
- Add/Edit/Delete services
- Automatic cost calculation
- Complete work order with end time

## 🚀 Future Enhancements

Potential features to add:

- PDF invoice generation
- Email notifications
- Parts inventory management
- Customer portal
- Analytics and reports
- Mobile app
- Payment tracking
- Appointment scheduling

## 🤝 Support

For issues or questions, please create an issue in the repository.

## 📄 License

MIT License - feel free to use this for your garage business!
