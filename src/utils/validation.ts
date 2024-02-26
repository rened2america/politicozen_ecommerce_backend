export const validateRequestBody = (reqBody: any): string | null => {
    const { urlImage, artistName, templates, position, colors, genders, sizes } = reqBody;

    // Validar urlImage
    if (typeof urlImage !== 'string') {
        return 'The urlImage field must be a string';
    }

    // Validar artistName
    if (typeof artistName !== 'string') {
        return 'The artistName field must be a string';
    }

    // Validar templates
    if (!Array.isArray(templates) || !templates.every((template: any) => typeof template === 'string')) {
        return 'The templates field should be an array of strings';
    }
    // Verificar que todos los templates estén incluidos en las plantillas permitidas
    const allowedTemplates = ['mug', 'hoodie', 't-shirt', 'sweatshirt'];
    if (!templates.every((template: string) => allowedTemplates.includes(template))) {
        return 'Templates field contains values not allowed';
    }

    // Validar position
    if (typeof position !== 'string') {
        return 'The position field must be a string';
    }
    // Verificar que position estén incluidos en las plantillas permitidas
    const allowedPositions = ['full front', 'left chest', 'right chest'];
    if (!allowedPositions.includes(position)) {
        return 'Position field contains a value not allowed';
    }

    // Validar color
    if (!Array.isArray(colors) || !colors.every((c: any) => typeof c === 'string')) {
        return 'Color field must be an array of strings';
    }
    // Verificar que todos los colores estén incluidos en los colores permitidos
    const allowedColors = ['white', 'beige', 'red', 'royal blue', 'black'];
    if (!colors.every((c: string) => allowedColors.includes(c))) {
        return 'The color field contains values that are not allowed';
    }

    // Validar genero
    if (!Array.isArray(genders) || !genders.every((g: any) => typeof g === 'string')) {
        return 'The genders field must be an array of strings.';
    }
    // Verificar que todos los géneros estén incluidos en los géneros permitidos
    const allowedGeneros = ['women', 'men', 'unisex', 'youth'];
    if (!genders.every((g: string) => allowedGeneros.includes(g))) {
        return 'Gender field contains values that are not allowed';
    }

    // Validar sizes
    if (!Array.isArray(sizes) || !sizes.every((s: any) => typeof s === 'string')) {
        return 'Field sizes must be an array of strings';
    }
    // Verificar que todos los tamaños estén incluidos en los tamaños permitidos
    const allowedSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
    if (!sizes.every((s: string) => allowedSizes.includes(s))) {
        return 'The sizes field contains values that are not allowed';
    }

    return null;
};