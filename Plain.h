#pragma once
#include <SFML/Graphics.hpp>
#include <vector>
#include "Enemy.h" 

class PlainLocation {
public:
    bool load();
    void draw(sf::RenderWindow& window);
    const std::vector<sf::RectangleShape>& getObstacles() const { return obstacles; }
    sf::Vector2f getSpawnPos() const { return spawnPos; }

    // Доступ к врагам
    EnemyManager& getEnemyManager() { return enemyManager; }

private:
    sf::Texture mapTexture;
    sf::Sprite mapSprite;
    std::vector<sf::RectangleShape> obstacles;
    sf::Vector2f spawnPos = { 512, 900 };

    EnemyManager enemyManager;  // Менеджер врагов
};
