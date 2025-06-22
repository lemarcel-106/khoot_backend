const jwt = require('jsonwebtoken');

exports.generateToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ecole: user.ecole,
    prenom: user.prenom,
    nom: user.nom,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  return token;
};


exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};


exports.decodedToken = (token) => {
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  return decodedToken.id;
}