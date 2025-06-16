function loadProducts() {
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(products => {
        let html = '';
        products.forEach(p => {
          html += `
          <div class="col-md-4">
            <div class="product-item image-zoom-effect link-effect">
              <div class="image-holder position-relative">
                <img src="${p.image || 'images/no-image.png'}" alt="${p.name}" class="product-image img-fluid">
                <div class="product-content">
                  <h5 class="text-uppercase fs-5 mt-3">${p.name}</h5>
                  <a href="#" class="text-decoration-none btn-add-cart" data-after="Add to cart" data-product-id="${p.id}">
                    <span>${p.price} บาท</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          `;
        });
        document.getElementById('product-list').innerHTML = html;
      });
  }
  
  // ดักคลิก Add to cart
  $(document).on('click', '.btn-add-cart', function(e) {
    e.preventDefault();
    const product_id = $(this).data('product-id');
    addToCart(product_id);
  });
  
  function addToCart(product_id) {
    fetch('http://localhost:3000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product_id,
        quantity: 1,
        session_id: 'guest'
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          alert('เพิ่มสินค้าลงตะกร้าแล้ว!');
        } else {
          alert('เกิดข้อผิดพลาด: ' + result.error);
        }
      });
  }
  
  // เรียกโหลดสินค้าเมื่อหน้าเว็บเสร็จ
  window.onload = loadProducts;
  