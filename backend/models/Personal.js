const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Personal = sequelize.define('Personal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cedula: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  cargo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  area: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  foto_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
    tableName: 'personal',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Personal;
