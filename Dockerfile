FROM php:7.4-apache

# Install required PHP extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Change Apache to listen on port 8000
RUN sed -i 's/80/8000/g' /etc/apache2/ports.conf /etc/apache2/sites-enabled/000-default.conf

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY ./src /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose the correct port
EXPOSE 8000

CMD ["apache2-foreground"]
