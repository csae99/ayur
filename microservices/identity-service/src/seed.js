const bcrypt = require('bcrypt');
const { Patient, Practitioner, Admin } = require('./models');
const sequelize = require('./config/database');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Patient
        await Patient.findOrCreate({
            where: { username: 'patient_user' },
            defaults: {
                fname: 'John',
                lname: 'Doe',
                password: hashedPassword,
                email: 'patient@example.com',
                phone: '1234567890',
                address: '123 Patient St',
            }
        });
        console.log('Patient created: patient_user / password123');

        // Create Practitioner
        await Practitioner.findOrCreate({
            where: { username: 'practitioner_user' },
            defaults: {
                fname: 'Jane',
                lname: 'Smith',
                password: hashedPassword,
                email: 'practitioner@example.com',
                phone: '0987654321',
                office_name: 'Smith Clinic',
                professionality: 'Ayurveda',
                address: '456 Healer Ave',
            }
        });
        console.log('Practitioner created: practitioner_user / password123');

        // Create Admin
        await Admin.findOrCreate({
            where: { username: 'admin_user' },
            defaults: {
                firstname: 'Super',
                lastname: 'Admin',
                password: hashedPassword,
                status: 'active',
            }
        });
        console.log('Admin created: admin_user / password123');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
