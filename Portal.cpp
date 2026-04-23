#include "Portal.h"
#include <iostream>

// === КЛАСС PORTAL ===
Portal::Portal(float x, float y) {
    for (int i = 1; i <= 4; i++) {
        sf::Texture tex;
        std::string filename = "portal_" + std::to_string(i) + ".png";

        if (tex.loadFromFile(filename)) {
            tex.setSmooth(false);
            textures.push_back(tex);
        }
        else {
            std::cout << "Error loading " << filename << std::endl;
        }
    }

    if (!textures.empty()) {
        sprite.setTexture(textures[0]);
        sprite.setPosition(x, y);
        sprite.setScale(1.5f, 1.5f);
    }
}

void Portal::update(float deltaTime) {
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

// === КЛАСС PORTALMANAGER ===
void PortalManager::loadTextures() {
    if (texturesLoaded) return;

    if (texBoss1.loadFromFile("portal_on_boss1.png")) {
        texBoss1.setSmooth(false);
        std::cout << "Loaded portal_on_boss1.png" << std::endl;
    }
    else {
        std::cout << "Error: portal_on_boss1.png not found!" << std::endl;
    }

    if (texBoss2.loadFromFile("portal_on_boss2.png")) {
        texBoss2.setSmooth(false);
        std::cout << "Loaded portal_on_boss2.png" << std::endl;
    }
    else {
        std::cout << "Error: portal_on_boss2.png not found!" << std::endl;
    }

    texturesLoaded = true;
}

void PortalManager::spawnPortal(sf::Vector2f position, PortalType type) {
    ActivePortal p;
    p.position = position;
    p.type = type;
    p.active = true;

    if (type == PORTAL_BOSS1) {
        p.sprite.setTexture(texBoss1);
    }
    else if (type == PORTAL_BOSS2) {
        p.sprite.setTexture(texBoss2);
    }

    p.sprite.setPosition(position);
    p.sprite.setScale(1.f, 1.f);

    portals.push_back(p);
    std::cout << "Portal spawned! Type: " << type << std::endl;
}

void PortalManager::drawAll(sf::RenderWindow& window) {
    for (const auto& portal : portals) {
        if (portal.active) {
            window.draw(portal.sprite);
        }
    }
}

int PortalManager::checkPlayerCollision(sf::FloatRect playerBounds) {
    for (size_t i = 0; i < portals.size(); ++i) {
        if (portals[i].active && playerBounds.intersects(portals[i].sprite.getGlobalBounds())) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

void PortalManager::removePortal(int index) {
    if (index >= 0 && index < portals.size()) {
        portals.erase(portals.begin() + index);
        std::cout << "Portal removed!" << std::endl;
    }
}

void PortalManager::clearAll() {
    portals.clear();
}
