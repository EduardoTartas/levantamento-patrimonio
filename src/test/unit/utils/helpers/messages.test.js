import messages from '@utils/helpers/messages.js';

describe('Messages Helper', () => {
    describe('Informative Messages', () => {
        test('deve retornar mensagens informativas básicas', () => {
            expect(messages.info.welcome).toBe("Bem-vindo à nossa aplicação!");
            expect(messages.info.userLoggedIn('Gilberto')).toBe("Usuário Gilberto logado com sucesso.");
        });
    });

    describe('Success Messages', () => {
        test('deve retornar mensagem de sucesso padrão', () => {
            expect(messages.success.default).toBe("Operação concluída com sucesso.");
        });
    });

    describe('Authorized Messages', () => {
        test('deve retornar mensagem de autorização padrão', () => {
            expect(messages.authorized.default).toBe("autorizado");
        });
    });

    describe('Error Messages', () => {
        test('deve retornar mensagens de erro básicas', () => {
            expect(messages.error.default).toBe("Ocorreu um erro ao processar a solicitação.");
            expect(messages.error.serverError).toBe("Erro interno do servidor. Tente novamente mais tarde.");
            expect(messages.error.validationError).toBe("Erro de validação. Verifique os dados fornecidos e tente novamente.");
            expect(messages.error.invalidRequest).toBe("Requisição inválida. Verifique os parâmetros fornecidos.");
            expect(messages.error.unauthorizedAccess).toBe("Acesso não autorizado. Faça login para continuar.");
            expect(messages.error.invalidURL).toBe("URL inválida. Verifique a URL fornecida.");
            expect(messages.error.unsupportedOperation).toBe("Operação não suportada neste contexto.");
            expect(messages.error.dataParsingError).toBe("Erro ao analisar os dados recebidos.");
            expect(messages.error.externalServiceError).toBe("Erro ao se comunicar com um serviço externo.");
            expect(messages.error.invalidApiKey).toBe("Chave de API inválida.");
            expect(messages.error.operationCanceled).toBe("Operação cancelada pelo usuário.");
        });

        test('deve retornar mensagens de erro com parâmetros', () => {
            expect(messages.error.resourceNotFound('Recurso')).toBe("Recurso não encontrado em Recurso.");
            expect(messages.error.duplicateEntry('CampoX')).toBe("Já existe um registro com o dado informado no(s) campo(s) CampoX.");
            expect(messages.error.resourceInUse('RecursoY')).toBe("Recurso em uso em RecursoY.");
            expect(messages.error.internalServerError('Usuário')).toBe("Erro interno no servidor ao processar Usuário.");
            expect(messages.error.unauthorized('Operação')).toBe("Erro de autorização: Operação.");
            expect(messages.error.resourceConflict('Recurso', 'Campo')).toBe("Conflito de recurso em Recurso contém Campo.");
            expect(messages.error.pageIsNotAvailable('1')).toBe("A página 1 não está disponível.");
            expect(messages.error.pageNotContainsData('2')).toBe("A página 2 não contém dados.");
            expect(messages.error.authenticationError('Sistema')).toBe("Erro de autenticação em Sistema.");
            expect(messages.error.permissionError('Acesso')).toBe("Erro de permissão em Acesso.");
        });
    });

    describe('Validation Messages', () => {
        test('deve retornar mensagens de validação genéricas', () => {
            expect(messages.validation.generic.fieldIsRequired('Campo')).toBe("O campo Campo é obrigatório.");
            expect(messages.validation.generic.fieldIsRepeated('Campo')).toBe("O campo Campo informado já está cadastrado.");
            expect(messages.validation.generic.invalidInputFormat('Campo')).toBe("Formato de entrada inválido para o campo Campo.");
            expect(messages.validation.generic.invalid('Campo')).toBe("Valor informado em Campo é inválido.");
            expect(messages.validation.generic.notFound('Campo')).toBe("Valor informado para o campo Campo não foi encontrado.");
            expect(messages.validation.generic.mustBeOneOf('Status', ['ativo', 'inativo'])).toBe("O campo Status deve ser um dos seguintes valores: ativo, inativo.");
        });

        test('deve retornar mensagens de validação para operações CRUD', () => {
            expect(messages.validation.generic.resourceCreated('Recurso')).toBe("Recurso criado(a) com sucesso.");
            expect(messages.validation.generic.resourceUpdated('Recurso')).toBe("Recurso atualizado(a) com sucesso.");
            expect(messages.validation.generic.resourceDeleted('Recurso')).toBe("Recurso excluído(a) com sucesso.");
            expect(messages.validation.generic.resourceAlreadyExists('Recurso')).toBe("Recurso já existe.");
        });

        test('deve retornar mensagens de validação de referência', () => {
            expect(messages.validation.reference.resourceWithReference('Usuário', 'Produto')).toBe("Usuário com referência em Produto. Exclusão impedida.");
        });

        test('deve retornar mensagens de validação customizadas', () => {
            expect(messages.validation.custom.invalidCPF.message).toBe("CPF inválido. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidCNPJ.message).toBe("CNPJ inválido. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidCEP.message).toBe("CEP inválido. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidPhoneNumber.message).toBe("Número de telefone inválido. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidMail.message).toBe("Email no formato inválido.");
            expect(messages.validation.custom.invalidYear.message).toBe("Ano inválido. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidDate.message).toBe("Data inválida. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidKilometerInitial.message).toBe("Quilometragem inicial inválida.");
            expect(messages.validation.custom.invalidKilometer.message).toBe("Quilometragem inválida.");
        });

        test('deve retornar mensagens de validação de data específicas', () => {
            expect(messages.validation.custom.invalidDatePast.message).toBe("Data do início deve ser uma data atual ou futura.");
            expect(messages.validation.custom.invalidDateFuture.message).toBe("A data de conclusão deve ser maior do que a data de início!");
            expect(messages.validation.custom.invalidDateCurrent.message).toBe("Data do início deve ser uma data atual ou passada.");
            expect(messages.validation.custom.invalidDateMonths.message).toBe("A data final da vigência não pode ser um período maior que 12 meses após a data de início da vigência.");
            expect(messages.validation.custom.invalidDataNascimento.message).toBe("Data de nascimento deve ser uma data passada e maior que 18 anos.");
            expect(messages.validation.custom.invalidDataAdmissao.message).toBe("Data de admissão deve ser uma data atual ou passada.");
            expect(messages.validation.custom.invalidYearSemester.message).toBe("Ano/semestre. Verifique o formato e tente novamente.");
            expect(messages.validation.custom.invalidYearStartSemester.message).toBe("Data do início do semestre deve ser menor que a data fim de semestre.");
        });
    });

    describe('Authentication Messages', () => {
        test('deve retornar mensagens de autenticação básicas', () => {
            expect(messages.auth.authenticationFailed).toBe("Falha na autenticação. Credenciais inválidas.");
            expect(messages.auth.invalidPermission).toBe("Permissão insuficiente para executar a operação.");
            expect(messages.auth.accountLocked).toBe("Conta bloqueada. Entre em contato com o suporte.");
            expect(messages.auth.invalidToken).toBe("Token inválido. Faça login novamente.");
            expect(messages.auth.invalidCredentials).toBe("Credenciais inválidas. Verifique seu usuário e senha.");
            expect(messages.auth.timeoutError).toBe("Tempo de espera excedido. Tente novamente mais tarde.");
            expect(messages.auth.databaseConnectionError).toBe("Erro de conexão com o banco de dados. Tente novamente mais tarde.");
        });

        test('deve retornar mensagens de autenticação com parâmetros', () => {
            expect(messages.auth.userNotFound('123')).toBe("Usuário com ID 123 não encontrado.");
            expect(messages.auth.duplicateEntry('NomeDeUsuario')).toBe("Já existe um registro com o mesmo NomeDeUsuario.");
            expect(messages.auth.emailAlreadyExists('email@example.com')).toBe("O endereço de email email@example.com já está em uso.");
        });
    });
});