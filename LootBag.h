#pragma once
#include <SFML/Graphics.hpp>
#include <vector>
#include "Inventory.h"

class LootBag {
public:
    LootBag();
    void init(sf::Vector2f position, const std::vector<Item>& items);
    void update();
    void draw(sf::RenderWindow& window);
    sf::FloatRect getBounds() const { return sprite.getGlobalBounds(); }
    bool isActive() const { return active; }
    void deactivate() { active = false; }
    const std::vector<Item>& getItems() const { return items; }
    sf::Vector2f getPosition() const { return sprite.getPosition(); }

    // === НОВЫЙ МЕТОД ДЛЯ УДАЛЕНИЯ ПРЕДМЕТА ===
    void removeItem(int index);

private:
    sf::Sprite sprite;
    sf::Texture texture;
    std::vector<Item> items;
    bool active;
    float bobTimer;
    float bobOffset;
};
