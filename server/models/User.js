const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ và tên'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'deleted'],
      default: 'active',
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// Hash password trước khi lưu vào database
userSchema.pre('save', async function () {
  // Chỉ hash khi password được thay đổi (hoặc tạo mới)
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password nhập vào với password đã hash trong DB
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Khi trả về JSON, tự động ẩn password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
