const fs = require('fs').promises;
const path = require('path');

// Simple template replacement function
function renderTemplate(template, data) {
    let result = template;

    // Replace {{variable}} with values
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, data[key] || '');
    });

    // Handle conditional sections {{#variable}}...{{/variable}}
    result = result.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
        return data[key] ? content : '';
    });

    return result;
}

async function loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf-8');
    return template;
}

async function renderEmailTemplate(templateName, data) {
    const template = await loadTemplate(templateName);
    return renderTemplate(template, data);
}

module.exports = {
    renderEmailTemplate
};
