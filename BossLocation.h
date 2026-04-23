#pragma once
#include <SFML/Graphics.hpp>
#include <vector>
#include <string>

class BossLocation {
public:
    // Загрузка карты, спавн героя и настройка коллизий
    bool load(const std::string& mapFilename, sf::Vector2f spawnPos, const std::vector<sf::RectangleShape>& walls);

    // Отрисовка карты
    void draw(sf::RenderWindow& window);

    // Геттеры для main.cpp
    const std::vector<sf::RectangleShape>& getObstacles() const { return obstacles; }
    sf::Vector2f getSpawnPos() const { return spawnPos; }

    // Место для спрайта босса (на будущее)
    sf::Sprite bossSprite;

private:
    sf::Texture mapTexture;
    sf::Sprite mapSprite;
    std::vector<sf::RectangleShape> obstacles;
    sf::Vector2f spawnPos;
};
