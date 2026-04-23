#include "BossLocation.h"
#include <iostream>

bool BossLocation::load(const std::string& mapFilename, sf::Vector2f spawn, const std::vector<sf::RectangleShape>& walls) {
    if (!mapTexture.loadFromFile(mapFilename)) {
        std::cout << "Error: Could not load " << mapFilename << std::endl;
        return false;
    }
    mapTexture.setSmooth(false);
    mapSprite.setTexture(mapTexture);

    spawnPos = spawn;
    obstacles = walls; // Копируем коллизии (или создай свои для боссов)

    return true;
}

void BossLocation::draw(sf::RenderWindow& window) {
    window.draw(mapSprite);
    // Если у босса есть спрайт, рисуем его здесь:
    // window.draw(bossSprite); 
}
