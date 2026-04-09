#include "Portal.h"
#include <iostream>

Portal::Portal(float x, float y) {
    // Загружаем 4 кадра
    for (int i = 1; i <= 4; i++) {
        sf::Texture tex;
        // Формируем имя файла: portal_1.png, portal_2.png...
        std::string filename = "portal_" + std::to_string(i) + ".png";

        if (tex.loadFromFile(filename)) {
            tex.setSmooth(false); // Оставляем четкие пиксели
            textures.push_back(tex);
        }
        else {
            std::cout << "Error loading " << filename << std::endl;
        }
    }

    // Если текстуры загрузились, настраиваем спрайт
    if (!textures.empty()) {
        sprite.setTexture(textures[0]);
        sprite.setPosition(x, y);
        // Увеличиваем масштаб, так как 40x78 маловато
        sprite.setScale(1.5f, 1.5f);
    }
}

void Portal::update(float deltaTime) {
    // Если текстуры не загрузились - выходим
    if (textures.empty()) return;

    frameTimer += deltaTime;
    if (frameTimer >= animationSpeed) {
        currentFrame = (currentFrame + 1) % 4;
        sprite.setTexture(textures[currentFrame]);
        frameTimer = 0;
    }
}

void Portal::draw(sf::RenderWindow& window) {
    window.draw(sprite);
}

bool Portal::isPlayerInside(sf::FloatRect playerBounds) {
    // Получаем полную зону портала
    sf::FloatRect portalBounds = sprite.getGlobalBounds();

    float shrinkX = portalBounds.width * 0.2f;
    float shrinkY = portalBounds.height * 0.2f;

    sf::FloatRect triggerZone(
        portalBounds.left + shrinkX,
        portalBounds.top + shrinkY,
        portalBounds.width - shrinkX * 2,
        portalBounds.height - shrinkY * 2
    );

    if (triggerZone.intersects(playerBounds)) {
        triggered = true;
        return true;
    }
    return false;
}
