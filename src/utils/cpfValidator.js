function isValidCPF(cpf) {
    if (typeof cpf !== 'string') return false;
    const numeros = cpf.replace(/\D/g, '');

    if (numeros.length !== 11 || /^(\d)\1+$/.test(numeros)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(numeros.charAt(i)) * (10 - i);
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(numeros.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(numeros.charAt(i)) * (11 - i);
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(numeros.charAt(10))) return false;

    return true;
}

export default isValidCPF;