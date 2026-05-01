#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

class Fireball {
public:
    Fireball();

    // Запуск огненного шара
    void shoot(sf::Vector2f startPos, sf::Vector2f direction, float damage);

    // Обновление (движение, время жизни)
    void update(float deltaTime);

    // Отрисовка
    void draw(sf::RenderWindow& window);

    // Проверка активности
    bool isActive() const { return active; }

    // Получение зоны поражения (для проверки столкновений)
    sf::FloatRect getBounds() const { return sprite.getGlobalBounds(); }

    // Получение урона
    float getDamage() const { return damage; }

    // Деактивация
    void deactivate() { active = false; }

private:
    sf::Sprite sprite;
    sf::Texture texture;
    sf::Vector2f velocity;
    float damage;
    float lifetime;      // Время жизни шара
    float maxLifetime;   // Максимальное время (чтобы не летел вечно)
    bool active;
    float speed;
};
