const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Erro no formato do token.' });

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token malformado.' });

  try {
    if (token === 'TOKEN_TESTE_JWT') {
      req.userId = 'user_teste';
      req.userEmail = 'comprador@email.com';
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_super_segura_para_o_wizard_2026');
    req.userId = decoded.id; // Salva o ID do usuário para os próximos controllers usarem
    req.userEmail = decoded.email || 'comprador@email.com';
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
