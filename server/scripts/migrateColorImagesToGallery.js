const mongoose = require('../node_modules/mongoose');
const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const products = await Product.find({
    $or: [
      { 'colorImages.0': { $exists: true } },
      { 'variants.image': { $exists: true, $ne: '' } }
    ]
  });

  console.log('Found products with colorImages or variant images:', products.length);

  let updatedCount = 0;
  for (const p of products) {
    const existingImgs = Array.isArray(p.images) ? [...p.images] : [];
    const seen = new Set([p.image, ...existingImgs].filter(Boolean));
    let added = 0;

    // Check colorImages
    if (Array.isArray(p.colorImages)) {
      for (const ci of p.colorImages) {
        if (ci.image && !seen.has(ci.image)) {
          existingImgs.push(ci.image);
          seen.add(ci.image);
          added++;
        }
      }
    }

    // Check variants
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (v.image && !seen.has(v.image)) {
          existingImgs.push(v.image);
          seen.add(v.image);
          added++;
        }
      }
    }

    if (added > 0) {
      p.images = existingImgs;
      await p.save();
      console.log(`✅ Migrated product "${p.name}": added ${added} image(s) to images array. Total images: ${p.images.length}`);
      updatedCount++;
    } else {
      console.log(`ℹ️ Product "${p.name}" already had all color images in images array.`);
    }
  }

  console.log(`\n🎉 Hoàn thành chuyển đổi: Đã cập nhật ${updatedCount} sản phẩm.`);
  await mongoose.disconnect();
}

migrate().catch(console.error);

