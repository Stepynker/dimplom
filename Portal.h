#pragma once
#include <SFML/Graphics.hpp>
#include <vector>

// Типы порталов
enum PortalType { PORTAL_BOSS1, PORTAL_BOSS2, PORTAL_TELEPORT };

// Структура активного портала (который выпал с врага)
struct ActivePortal {
    sf::Sprite sprite;
    PortalType type;
    sf::Vector2f position;
    bool active;

    ActivePortal() : type(PORTAL_BOSS1), position(0.f, 0.f), active(false) {}
};

// Класс обычного портала (статичного)
class Portal {
public:
    Portal(float x, float y);
    void resetTrigger() { triggered = false; }
    void update(float deltaTime);
    void draw(sf::RenderWindow& window);
    bool isPlayerInside(sf::FloatRect playerBounds);
    bool triggered = false;

private:
    std::vector<sf::Texture> textures;
    sf::Sprite sprite;
    int currentFrame = 0;
    float frameTimer = 0;
    float animationSpeed = 0.1f;
};

// Менеджер порталов (управляет выпадающими порталами)
class PortalManager {
public:
    // Загрузка текстур
    void loadTextures();

    // Спавн портала в точке
    void spawnPortal(sf::Vector2f position, PortalType type);

    // Отрисовка всех порталов
    void drawAll(sf::RenderWindow& window);

    // Проверка столкновения с игроком
    int checkPlayerCollision(sf::FloatRect playerBounds); // Возвращает индекс портала или -1

    // Удаление портала по индексу
    void removePortal(int index);

    // Очистка всех порталов
    void clearAll();

    // Получение всех порталов
    std::vector<ActivePortal>& getPortals() { return portals; }

private:
    std::vector<ActivePortal> portals;
    sf::Texture texBoss1, texBoss2;
    bool texturesLoaded = false;
};
