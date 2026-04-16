#pragma once
#include <SFML/Graphics.hpp>

class Arrow {
public:
    Arrow();
    void shoot(const sf::Vector2f& startPos, const sf::Vector2f& direction, float damage);
    void update(float deltaTime);
    void draw(sf::RenderWindow& window);
    bool isActive() const { return active; }
    sf::FloatRect getBounds() const;
    void deactivate();

private:
    sf::Sprite sprite;
    sf::Texture texture;
    sf::Vector2f position;
    sf::Vector2f velocity;
    float damage;
    bool active;
    float speed = 400.f; // Скорость полёта стрелы
};
