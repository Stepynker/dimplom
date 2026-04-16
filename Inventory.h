#pragma once
#include <SFML/Graphics.hpp>
#include <vector>
#include <string>

enum ItemType {
    ITEM_WEAPON = 0,
    ITEM_ARMOR = 1,
    ITEM_ACCESSORY = 2,
    ITEM_NONE = -1
};

struct Item {
    std::string name;
    sf::Texture texture;
    ItemType type;
    bool isEquipped;
    float damage;

    Item() : type(ITEM_NONE), isEquipped(false), damage(0.f) {}
    Item(const std::string& n, const std::string& filename, ItemType t, float dmg = 0.f)
        : name(n), type(t), isEquipped(false), damage(dmg) {
        if (!texture.loadFromFile(filename)) {
            texture.create(16, 16);
        }
        texture.setSmooth(false);
    }
};

class Inventory {
public:
    void init();
    void updatePositions(const sf::Sprite& hudSprite);
    void update(float deltaTime, const sf::Vector2i& mousePos, bool lmbPressed, bool lmbReleased);
    void draw(sf::RenderWindow& window);

    const std::vector<Item>& getEquipment() const { return equipment; }
    const std::vector<Item>& getBackpack() const { return backpack; }

private:
    std::vector<Item> equipment;
    std::vector<Item> backpack;

    std::vector<sf::Vector2f> equipSlotPositions;
    std::vector<sf::Vector2f> backpackSlotPositions;

    Item* draggedItem = nullptr;
    int draggedFromIndex = -1;
    sf::Vector2f dragOffset;
    sf::Sprite draggedSprite;

    static constexpr float SLOT_SIZE = 64.f;
    static constexpr float ICON_SCALE = 4.0f;
};
