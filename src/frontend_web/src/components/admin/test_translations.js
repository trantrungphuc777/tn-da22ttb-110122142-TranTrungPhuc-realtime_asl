import { translations } from '../../data/translations.js';
import fs from 'fs';

const enAuto = translations.en.admin.auto;
let vietStrings = {};

const vietChars = 'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ';
const isViet = (text) => text.toLowerCase().split('').some(c => vietChars.includes(c));

for (const [key, value] of Object.entries(enAuto)) {
    if (isViet(value)) {
        vietStrings[key] = value;
    }
}

fs.writeFileSync('viet_in_en.json', JSON.stringify(vietStrings, null, 2));
console.log('Saved 88 strings to viet_in_en.json');
