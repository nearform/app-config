FROM nginx:1.13.5

WORKDIR /usr/src

ADD docker/nginx.conf /etc/nginx/
ADD docker/start.sh /usr/src/
ADD docker/robots.txt /var/www/
RUN chmod +x /usr/src/start.sh

ADD build /var/www/

RUN chmod +x /usr/src/start.sh

EXPOSE 80

VOLUME /var/www

CMD ./start.sh