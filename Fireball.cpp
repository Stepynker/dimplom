#include "Fireball.h"
#include <iostream>
#include <cmath>

Fireball::Fireball()
    : active(false), damage(0.f), lifetime(0.f), maxLifetime(2.f), speed(400.f) {

    if (!texture.loadFromFile("fireball.png")) {
        std::cout << "Error: fireball.png not found!" << std::endl;
        texture.create(16, 16); // Заглушка
    }
    texture.setSmooth(false);
    sprite.setTexture(texture);
    sprite.setScale(2.f, 2.f);
    sprite.setOrigin(8.f, 8.f); // Центр спрайта для вращения
}

void Fireball::shoot(sf::Vector2f startPos, sf::Vector2f direction, float dmg) {
    // Нормализуем направление
    float len = std::sqrt(direction.x * direction.x + direction.y * direction.y);
    if (len > 0.f) {
        direction /= len;
    }

    sprite.setPosition(startPos);
    velocity = direction * speed;
    damage = dmg;
    lifetime = 0.f;
    active = true;

    std::cout << "Fireball launched!" << std::endl;
}

void Fireball::update(float deltaTime) {
    if (!active) return;

    // Движение
    sprite.move(velocity * deltaTime);

    // Время жизни
    lifetime += deltaTime;
    if (lifetime >= maxLifetime) {
        deactivate();
        std::cout << "Fireball expired" << std::endl;
    }

    // Вращение для эффекта
    sprite.rotate(10.f * deltaTime * 60.f); // ~10 оборотов в секунду
}

void Fireball::draw(sf::RenderWindow& window) {
    if (active) {
        window.draw(sprite);
    }
}
