import fakerbr from 'faker-br';
import Inventario from '../models/inventario.js';
import Campus from '../models/campus.js';

export default async function inventarioSeed() {
    // Serão gerados 50 inventários com campi aleatórios
  
    const campusList = await Campus.find({});
    
    await Inventario.deleteMany({});
  
    for (let i = 0; i < 50; i++) {
        const randomIndex = Math.floor(Math.random() * campusList.length);
        const selectedCampus = campusList[randomIndex].objectId;
        const nome = fakerbr.lorem.word(10);
        const data = fakerbr.date.past();
        const status = fakerbr.random.Boolean();
        const inventario = {
            campus: selectedCampus,
            nome,
            data,
            status
        };
        await Inventario.create(inventario);
    }
    console.log("Inventários gerados com sucesso");
}
