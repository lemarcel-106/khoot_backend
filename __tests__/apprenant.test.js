const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Apprenant = require('../models/Apprenant');

describe('Apprenant API', () => {

    beforeEach(async () => {
        await Apprenant.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('devrait créer un nouvel apprenant', async () => {
        const res = await request(app)
            .post('/api/apprenant')
            .send({
                "nom": "Mboungou",
                "prenom": "Paul",
                "phone": "068922298",
                "email": "geek@gmail.com",
                "avatar": "Chemin vers mon avatar",
                "matricule": "12445556",
                "ecole": "66ffdd02887fde57a5687b7a"
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data).toHaveProperty('_id');
    });

    // it('devrait mettre à jour un apprenant', async () => {
    //     const apprenant = new Apprenant({
    //         nom: "John",
    //         prenom: "Doe",
    //         matricule: "A123",
    //         genre: "M",
    //         statut: "actif",
    //         phone: "0123456789",
    //         email: "john.doe@example.com",
    //         adresse: "123 Main St"
    //     });
    //     await apprenant.save();

    //     const res = await request(app)
    //         .put('/apprenant/update')
    //         .send({
    //             id: apprenant._id,
    //             nom: "Jane" 
    //         });

    //     expect(res.statusCode).toEqual(200);
    //     expect(res.body.data.nom).toEqual("Jane"); 
    // });

    // it('devrait supprimer un apprenant', async () => {
    //     const apprenant = new Apprenant({
    //         nom: "John",
    //         prenom: "Doe",
    //         matricule: "A123",
    //         genre: "M",
    //         statut: "actif",
    //         phone: "0123456789",
    //         email: "john.doe@example.com",
    //         adresse: "123 Main St"
    //     });
    //     await apprenant.save();

    //     const res = await request(app)
    //         .delete('/apprenant/delete') 
    //         .send({ id: apprenant._id });

    //     expect(res.statusCode).toEqual(200);
    //     const apprenantSupp = await Apprenant.findById(apprenant._id);
    //     expect(apprenantSupp).toBeNull(); 
    // });

});
