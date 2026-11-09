require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const runTest = async () => {
  console.log('🚀 Bắt đầu kiểm thử tích hợp Đa hình ảnh & Ảnh theo màu sắc (Product Gallery & Color Images)...');

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Thiếu biến môi trường MONGODB_URI');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB');

    // 1. Tạo sản phẩm mẫu có nhiều màu sắc và nhiều ảnh
    const testProductName = `TEST TEE MULTI-IMAGE ${Date.now()}`;
    const testProduct = await Product.create({
      name: testProductName,
      description: 'Sản phẩm thử nghiệm nhiều hình ảnh và màu sắc',
      price: 450000,
      costPrice: 200000,
      category: 'Áo',
      image: 'https://res.cloudinary.com/demo/image/upload/sample_main.jpg',
      images: [
        'https://res.cloudinary.com/demo/image/upload/sample_back.jpg',
        'https://res.cloudinary.com/demo/image/upload/sample_detail.jpg',
      ],
      colorImages: [
        { color: 'Đen', image: 'https://res.cloudinary.com/demo/image/upload/sample_black.jpg' },
        { color: 'Trắng', image: 'https://res.cloudinary.com/demo/image/upload/sample_white.jpg' },
        { color: 'Đỏ', image: 'https://res.cloudinary.com/demo/image/upload/sample_red.jpg' },
      ],
      variants: [
        { size: 'M', color: 'Đen', stock: 10, image: 'https://res.cloudinary.com/demo/image/upload/sample_black.jpg' },
        { size: 'L', color: 'Đen', stock: 5, image: 'https://res.cloudinary.com/demo/image/upload/sample_black.jpg' },
        { size: 'M', color: 'Trắng', stock: 8, image: 'https://res.cloudinary.com/demo/image/upload/sample_white.jpg' },
        { size: 'M', color: 'Đỏ', stock: 12, image: 'https://res.cloudinary.com/demo/image/upload/sample_red.jpg' },
      ],
    });

    console.log('  ✅ [PASS] 1. Tạo sản phẩm với nhiều ảnh và ảnh theo màu thành công');

    // 2. Kiểm tra truy vấn chi tiết sản phẩm
    const fetched = await Product.findById(testProduct._id);
    if (!fetched) throw new Error('Không tìm thấy sản phẩm vừa tạo');

    if (fetched.images.length !== 2) {
      throw new Error(`Kỳ vọng 2 ảnh phụ, nhận được ${fetched.images.length}`);
    }
    console.log('  ✅ [PASS] 2. Danh sách ảnh phụ (images) lưu trữ chính xác (2 ảnh)');

    if (fetched.colorImages.length !== 3) {
      throw new Error(`Kỳ vọng 3 ảnh màu, nhận được ${fetched.colorImages.length}`);
    }
    console.log('  ✅ [PASS] 3. Danh sách ảnh theo màu (colorImages) lưu trữ chính xác (3 màu: Đen, Trắng, Đỏ)');

    // 3. Kiểm tra ảnh của biến thể
    const blackVariant = fetched.variants.find((v) => v.color === 'Đen');
    if (!blackVariant || !blackVariant.image.includes('sample_black.jpg')) {
      throw new Error('Ảnh biến thể màu Đen không khớp');
    }
    console.log('  ✅ [PASS] 4. Biến thể thừa hưởng đúng ảnh đại diện của màu sắc tương ứng');

    // 4. Cập nhật thêm ảnh phụ mới và cập nhật ảnh cho một màu
    fetched.images.push('https://res.cloudinary.com/demo/image/upload/sample_fabric.jpg');
    const redColorImg = fetched.colorImages.find((ci) => ci.color === 'Đỏ');
    if (redColorImg) {
      redColorImg.image = 'https://res.cloudinary.com/demo/image/upload/sample_red_v2.jpg';
    }
    await fetched.save();

    const updated = await Product.findById(testProduct._id);
    if (updated.images.length !== 3) {
      throw new Error('Cập nhật thêm ảnh phụ thất bại');
    }
    const updatedRed = updated.colorImages.find((ci) => ci.color === 'Đỏ');
    if (!updatedRed || !updatedRed.image.includes('sample_red_v2.jpg')) {
      throw new Error('Cập nhật ảnh màu Đỏ thất bại');
    }
    console.log('  ✅ [PASS] 5. Cập nhật thêm ảnh phụ và sửa ảnh theo màu thành công');

    // 5. Dọn dẹp dữ liệu kiểm thử
    await Product.findByIdAndDelete(testProduct._id);
    console.log('  ✅ [PASS] 6. Dọn dẹp sản phẩm kiểm thử an toàn');

    console.log('\n========================================');
    console.log('🎉 TẤT CẢ 6 KIỂM THỬ ĐA ẢNH & MÀU SẮC ĐỀU ĐẠT 100%!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Kiểm thử thất bại:', err);
    process.exit(1);
  }
};

runTest();

