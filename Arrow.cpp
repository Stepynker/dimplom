#include "Arrow.h"
#include <iostream>
#include <cmath>

Arrow::Arrow() : active(false), damage(0.f) {
    if (texture.loadFromFile("arrow_shot.png")) {
        texture.setSmooth(false);
        sprite.setTexture(texture);
        sprite.setScale(2.f, 2.f);
        std::cout << "Arrow texture loaded!" << std::endl;
    }
    else {
        std::cout << "ERROR: arrow_shot.png not found!" << std::endl;
        // Создаём временную красную полоску вместо стрелы
        sf::Image img;
        img.create(8, 16, sf::Color::Red);
        texture.loadFromImage(img);
        sprite.setTexture(texture);
        sprite.setScale(2.f, 2.f);
    }
}

void Arrow::shoot(const sf::Vector2f& startPos, const sf::Vector2f& direction, float dmg) {
    std::cout << "SHOOT! Pos: " << startPos.x << "," << startPos.y
        << " Dir: " << direction.x << "," << direction.y << std::endl;

    position = startPos;
    damage = dmg;

    // Нормализуем направление и задаём скорость
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0.f) {
        velocity = sf::Vector2f(
            (direction.x / length) * speed,
            (direction.y / length) * speed
        );
    }

    // Поворачиваем стрелу по направлению полёта
    float angle = std::atan2(direction.y, direction.x) * 180.f / 3.14159f;
    sprite.setRotation(angle + 90.f); // +90 потому что спрайт смотрит вверх

    sprite.setPosition(position);
    active = true;
}

void Arrow::update(float deltaTime) {
    if (!active) return;

    position += velocity * deltaTime;
    sprite.setPosition(position);

    // Если стрела улетела далеко за экран — деактивируем
    if (position.x < -100 || position.x > 2000 ||
        position.y < -100 || position.y > 2000) {
        deactivate();
    }
}

void Arrow::draw(sf::RenderWindow& window) {
    if (active) {
        window.draw(sprite);
    }
}

void Arrow::deactivate() {
    active = false;
}

sf::FloatRect Arrow::getBounds() const {
    return sprite.getGlobalBounds();
}
