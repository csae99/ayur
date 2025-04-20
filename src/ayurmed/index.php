<?php
include "includes/head.php"
?>

<body>

  <div class="site-wrap">
    <?php
    include "includes/header.php"
    ?>
    <div class="site-blocks-cover" style="background-image: url('images/main.jpg');">
      <div class="container">
        <div class="row">
          <div class="col-lg-7 mx-auto order-lg-2 align-self-center">
            <div class="site-block-cover-content text-center">
              <h2 class="sub-title">Traditional Medicine, Healthy Medicine Everyday</h2>
              <h1>Welcome To AYURMED</h1>
              <p>
                <a href="store.php" class="btn btn-primary px-5 py-3">Shop Now</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="site-section">
      <div class="container">
        <div class="row align-items-stretch section-overlap">
          <div class="col-md-6 col-lg-4 mb-4 mb-lg-0">
            <div class="banner-wrap bg-primary h-100">
              <a href="#" class="h-100">
                <h5>Free <br> Shipping</h5>
                <p>
                  ₹0 charge for all your orders delivery
                  <strong>for Orders above ₹199.</strong>
                </p>
              </a>
            </div>
          </div>
          <div class="col-md-6 col-lg-4 mb-4 mb-lg-0">
            <div class="banner-wrap h-100">
              <a href="#" class="h-100">
                <h5>Season <br> Sale 50% Off</h5>
                <p>
                  Up to 80% off on ayurvedic products.

                </p>
              </a>
            </div>
          </div>
          <div class="col-md-6 col-lg-4 mb-4 mb-lg-0">
            <div class="banner-wrap bg-warning h-100">
              <a href="#" class="h-100">
                <h5>New <br> Products</h5>
                <p>
                  Explore products that helps to heal you.
                </p>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="site-section">
      <div class="container">
        <div class="row">
          <div class="title-section text-center col-12">
            <h2 class="text-uppercase">Products You Might Like</h2>
          </div>
        </div>

        <div class="row">
          <?php
          $data = all_products();
          $num = sizeof($data);
          for ($i = 0; $i < $num; $i++) {
          ?>
            <div class="col-sm-6 col-lg-4 text-center item mb-4">
              <a href="product.php?product_id=<?php echo $data[$i]['item_id'] ?>"> <img class="rounded mx-auto d-block" style="width:20vw ; height:40vh ;" src="images/<?php echo $data[$i]['item_image'] ?>" alt="Image"></a>
              <?php if (strlen($data[$i]['item_title']) <= 20) { ?>
                <h3 class="text-dark"><a href="product.php?product_id=<?php echo $data[$i]['item_id'] ?>"><?php echo $data[$i]['item_title'] ?></a></h3>
              <?php
              } else {
              ?>
                <h3 class="text-dark"><a href="product.php?product_id=<?php echo $data[$i]['item_id'] ?>"><?php echo substr($data[$i]['item_title'], 0, 20) . "..." ?></a></h3>
              <?php
              }
              ?>
              <p class="price">₹<?php echo $data[$i]['item_price'] ?></p>
            </div>
          <?php
            if ($i == 5) {
              break;
            }
          }
          ?>
        </div>
        <div class="row mt-5">
          <div class="col-12 text-center">
            <a href="store.php" class="btn btn-primary px-4 py-3">View All Products</a>
          </div>
        </div>
      </div>
    </div>


    
    <div class="site-section">
      <div class="container">
        <div class="row">
          <div class="title-section text-center col-12">
            <h2 class="text-uppercase">Testimonials</h2>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 block-3 products-wrap">
            <div class="nonloop-block-3 no-direction owl-carousel">

              <div class="testimony">
                <blockquote>
                  <img src="images/person_1.jpg" alt="Image" class="img-fluid w-25 mb-4 rounded-circle">
                  <p>&ldquo;"I've struggled with digestive issues for years, trying various medications with minimal relief. 
                    After discovering Ayurmed, I noticed a significant improvement in my digestion within just a few weeks. 
                    I'm amazed at how gentle yet effective these remedies are. Highly recommend!"&rdquo;</p>
                </blockquote>

                <p>&mdash; Kelly Holmes</p>
              </div>

              <div class="testimony">
                <blockquote>
                  <img src="images/person_2.jpg" alt="Image" class="img-fluid w-25 mb-4 rounded-circle">
                  <p>&ldquo;As someone who prefers natural remedies, I was delighted to find Ayurmed.
                     Their products have truly transformed my approach to health and wellness.
                      From managing stress to boosting my immunity, I've experienced tangible benefits. 
                      Thank you for providing such authentic Ayurvedic solutions!&rdquo;</p>
                </blockquote>

                <p>&mdash; Rebecca Morando</p>
              </div>

              <div class="testimony">
                <blockquote>
                  <img src="images/person_3.jpg" alt="Image" class="img-fluid w-25 mb-4 rounded-circle">
                  <p>&ldquo;I've battled chronic joint pain for years, and nothing seemed to alleviate my discomfort until I tried Ayurmed.
                     Their herbal formulations have provided me with much-needed relief without any negative side effects. 
                     I'm finally able to enjoy life again without the constant burden of pain. Grateful beyond words!&rdquo;</p>
                </blockquote>

                <p>&mdash; Lucas Gallone</p>
              </div>

              <div class="testimony">
                <blockquote>
                  <img src="images/person_4.jpg" alt="Image" class="img-fluid w-25 mb-4 rounded-circle">
                  <p>&ldquo;Dealing with insomnia was taking a toll on my overall well-being. 
                    Desperate for a solution, I turned to Ayurmed, and it's been a game-changer. 
                    Their sleep aid supplements are gentle yet effective, allowing me to enjoy restorative sleep without any grogginess the next day. 
                    Thank you for helping me reclaim my nights!&rdquo;</p>
                </blockquote>

                <p>&mdash; Andrew Neel</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>


    <?php
    include "includes/footer.php"
    ?>
  </div>



</body>

</html>