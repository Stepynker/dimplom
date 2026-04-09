#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

class PlainLocation {
public:
    bool load();
    void draw(sf::RenderWindow& window);

    std::vector<sf::RectangleShape>& getObstacles() { return obstacles; }
    sf::Vector2f getSpawnPos() const { return spawnPos; }

private:
    sf::Texture mapTexture;
    sf::Sprite mapSprite;
    std::vector<sf::RectangleShape> obstacles;
    sf::Vector2f spawnPos = { 512, 900 };
};
