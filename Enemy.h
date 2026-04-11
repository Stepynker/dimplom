#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

class Enemy {
public:
    Enemy(float x, float y);
    void draw(sf::RenderWindow& window);
    sf::FloatRect getBounds() const;
    sf::Vector2f getPosition() const;

private:
    sf::Sprite sprite;  // Спрайт врага
    sf::Vector2f position;

    // Статическая текстура — одна на всех врагов (экономит память)
    static sf::Texture enemyTexture;
    static bool textureLoaded;  // Флаг: загрузили ли уже текстуру
};

class EnemyManager {
public:
    void spawnRandomEnemies(int count);
    void drawAll(sf::RenderWindow& window);
    const std::vector<Enemy>& getEnemies() const { return enemies; }

private:
    std::vector<Enemy> enemies;
};
