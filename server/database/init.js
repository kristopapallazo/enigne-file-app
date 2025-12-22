import pg from "pg";
const { Pool } = pg;

// Pool instance - will be initialized in initDatabase
let poolInstance = null;

// Getter for pool that ensures it's initialized
export const pool = {
  query: async (...args) => {
    if (!poolInstance) {
      throw new Error('Database pool not initialized. Call initDatabase() first.');
    }
    return poolInstance.query(...args);
  },
  connect: async () => {
    if (!poolInstance) {
      throw new Error('Database pool not initialized. Call initDatabase() first.');
    }
    return poolInstance.connect();
  }
};

export async function initDatabase() {
  try {
    // Initialize the pool connection
    poolInstance = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
    });

    // Test the connection
    await poolInstance.query('SELECT NOW()');
    console.log('✅ Database connection established');

    // Drop existing tables in correct order (reverse of dependencies)
    await poolInstance.query('DROP TABLE IF EXISTS services CASCADE');
    await poolInstance.query('DROP TABLE IF EXISTS work_orders CASCADE');
    await poolInstance.query('DROP TABLE IF EXISTS cars CASCADE');
    await poolInstance.query('DROP TABLE IF EXISTS employees CASCADE');
    await poolInstance.query('DROP TABLE IF EXISTS clients CASCADE');
    await poolInstance.query('DROP TABLE IF EXISTS users CASCADE');
    await poolInstance.query('DROP TABLE IF EXISTS garages CASCADE');
    console.log('🗑️ Dropped existing tables');

    // Garages table (tenants/accounts)
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS garages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        subscription_status VARCHAR(50) DEFAULT 'trial',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table (for authentication)
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        garage_id INTEGER NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE
      )
    `);

    // Clients table
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        garage_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE
      )
    `);

    // Cars table
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        garage_id INTEGER NOT NULL,
        plate VARCHAR(50) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER,
        client_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        UNIQUE (garage_id, plate)
      )
    `);

    // Employees table
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        garage_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(100) DEFAULT 'Mechanic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE
      )
    `);

    // Work orders (Bills) table
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id SERIAL PRIMARY KEY,
        garage_id INTEGER NOT NULL,
        bill_number VARCHAR(100) NOT NULL,
        car_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        start_datetime TIMESTAMP NOT NULL,
        end_datetime TIMESTAMP,
        total_cost DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'in_progress',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE,
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE (garage_id, bill_number)
      )
    `);

    // Services table (items in a work order)
    await poolInstance.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        garage_id INTEGER NOT NULL,
        work_order_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_users_garage ON users(garage_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_garage ON clients(garage_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_cars_garage ON cars(garage_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_cars_plate ON cars(garage_id, plate);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_cars_client ON cars(client_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_garage ON employees(garage_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_garage ON work_orders(garage_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_client ON work_orders(client_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_car ON work_orders(car_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_services_garage ON services(garage_id);
    `);
    await poolInstance.query(`
      CREATE INDEX IF NOT EXISTS idx_services_work_order ON services(work_order_id);
    `);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
