const User = require('./models/User');

(async () => {
  const user = await User.findOne({ where: { email: 'admin@example.com' } });
  const match = await user.matchPassword('Admin@123');
  console.log('Password match:', match);
})();
