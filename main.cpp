#include <SFML/Graphics.hpp>
#include <iostream>
#include <vector>

// Функция для рисования текстуры
void drawTiledTexture(sf::RenderWindow& window, const sf::Texture& texture, sf::FloatRect area) {
    sf::Sprite sprite(texture);
    for (float x = area.left; x < area.left + area.width; x += texture.getSize().x) {
        for (float y = area.top; y < area.top + area.height; y += texture.getSize().y) {
            sprite.setPosition(x, y);
            window.draw(sprite);
        }
    }
}

int main()
{
    //ОКНО НА ВЕСЬ ЭКРАН 
    sf::RenderWindow window(sf::VideoMode::getFullscreenModes()[0], "My Pixel RPG", sf::Style::Fullscreen);
    window.setFramerateLimit(60);

    const int WORLD_WIDTH = 2000;
    const int WORLD_HEIGHT = 2000;

    //  ЗАГРУЗКА ГЕРОЯ 
    std::vector<sf::Texture> texturesDown(4);
    std::vector<sf::Texture> texturesUp(4);
    std::vector<sf::Texture> texturesLeft(4);
    std::vector<sf::Texture> texturesRight(4); 

    for (int i = 1; i <= 4; i++) {
        texturesDown[i - 1].loadFromFile("hero_down_" + std::to_string(i) + ".png");
        texturesUp[i - 1].loadFromFile("hero_up_" + std::to_string(i) + ".png");
        texturesLeft[i - 1].loadFromFile("hero_left_" + std::to_string(i) + ".png");
        texturesRight[i - 1].loadFromFile("hero_right_" + std::to_string(i) + ".png");

        // ПИКСЕЛЬ-АРТ
        texturesDown[i - 1].setSmooth(false);
        texturesUp[i - 1].setSmooth(false);
        texturesLeft[i - 1].setSmooth(false);
        texturesRight[i - 1].setSmooth(false);
    }

    //  ТЕКСТУРЫ АТАКИ
    std::vector<sf::Texture> atkDown(2), atkUp(2), atkLeft(2), atkRight(2);
    for (int i = 1; i <= 2; i++) {
        atkDown[i - 1].loadFromFile("atk_down_" + std::to_string(i) + ".png");
        atkUp[i - 1].loadFromFile("atk_up_" + std::to_string(i) + ".png");
        atkLeft[i - 1].loadFromFile("atk_left_" + std::to_string(i) + ".png");
        atkRight[i - 1].loadFromFile("atk_right_" + std::to_string(i) + ".png");

        atkDown[i - 1].setSmooth(false); atkUp[i - 1].setSmooth(false);
        atkLeft[i - 1].setSmooth(false); atkRight[i - 1].setSmooth(false);
    }

    // ОКРУЖЕНИЕ
    sf::Texture texFloor;
    texFloor.loadFromFile("floor.png");
    texFloor.setSmooth(false);

    sf::Texture texWall;
    texWall.loadFromFile("wall.png");
    texWall.setSmooth(false);

    //  HUD (ИНТЕРФЕЙС)
    sf::Texture texHudBg;
    texHudBg.loadFromFile("hud_bg.png");
    texHudBg.setSmooth(false);
    sf::Sprite hudBg(texHudBg);

    sf::Texture texHp;
    texHp.loadFromFile("hp_bar.png");
    texHp.setSmooth(false);
    sf::Sprite hpBar(texHp);

    sf::Texture texMp;
    texMp.loadFromFile("mp_bar.png");
    texMp.setSmooth(false);
    sf::Sprite mpBar(texMp);

    sf::Texture texXp;
    texXp.loadFromFile("xp_bar.png");
    texXp.setSmooth(false);
    sf::Sprite xpBar(texXp);

    sf::Texture texWeapon;
    texWeapon.loadFromFile("weapon_bar.png");
    texWeapon.setSmooth(false);
    sf::Sprite weaponBar(texWeapon);

    sf::Texture texInv;
    texInv.loadFromFile("inv_bar.png");
    texInv.setSmooth(false);
    sf::Sprite invBar(texInv);

    //  ГЕРОЙ
    sf::Sprite hero(texturesDown[0]);
    hero.setPosition(100, 100);
    hero.setScale(2.f, 2.f);

    //  КАМЕРА
    sf::View camera;
    camera.setSize(1280, 720);

    // Центрируем камеру на СЕРЕДИНЕ героя
    sf::FloatRect heroBounds = hero.getGlobalBounds();
    camera.setCenter(
        heroBounds.left + heroBounds.width / 2.f,
        heroBounds.top + heroBounds.height / 2.f
    );

    // Центрируем камеру на середине этих границ
    camera.setCenter(
        heroBounds.left + heroBounds.width / 2.f,
        heroBounds.top + heroBounds.height / 2.f
    );

    //  СТЕНЫ 
    std::vector<sf::RectangleShape> walls;
    float wallThickness = 64;

    sf::RectangleShape wall1(sf::Vector2f(WORLD_WIDTH, wallThickness)); wall1.setPosition(0, 0); walls.push_back(wall1);
    sf::RectangleShape wall2(sf::Vector2f(WORLD_WIDTH, wallThickness)); wall2.setPosition(0, WORLD_HEIGHT - wallThickness); walls.push_back(wall2);
    sf::RectangleShape wall3(sf::Vector2f(wallThickness, WORLD_HEIGHT)); wall3.setPosition(0, 0); walls.push_back(wall3);
    sf::RectangleShape wall4(sf::Vector2f(wallThickness, WORLD_HEIGHT)); wall4.setPosition(WORLD_WIDTH - wallThickness, 0); walls.push_back(wall4);

    for (auto& w : walls) w.setFillColor(sf::Color::Transparent);

    //  ПЕРЕМЕННЫЕ 
    int currentFrame = 0;
    float animationSpeed = 0.15f;
    float animationTimer = 0.f;
    int currentDirection = 0;
    bool isMoving = false;
    float speed = 250.0f;
    sf::Clock clock;

    // Переменные для атаки
    bool isAttacking = false;
    int attackFrame = 0;
    float attackTimer = 0.f;
    const float ATTACK_SPEED = 0.2f; // Скорость анимации атаки

    auto checkCollision = [&](sf::FloatRect heroRect) -> bool {
        for (auto& wall : walls) {
            if (heroRect.intersects(wall.getGlobalBounds())) return true;
        }
        return false;
        };

    while (window.isOpen())
    {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed) window.close();
            if (event.type == sf::Event::KeyPressed && event.key.code == sf::Keyboard::Escape) window.close();
        }

        float deltaTime = clock.restart().asSeconds();
        sf::Vector2f movement(0.f, 0.f);
        isMoving = false;

        if (sf::Keyboard::isKeyPressed(sf::Keyboard::W)) { movement.y -= 1.f; currentDirection = 1; isMoving = true; }
        else if (sf::Keyboard::isKeyPressed(sf::Keyboard::S)) { movement.y += 1.f; currentDirection = 0; isMoving = true; }
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::A)) { movement.x -= 1.f; currentDirection = 2; isMoving = true; }
        else if (sf::Keyboard::isKeyPressed(sf::Keyboard::D)) { movement.x += 1.f; currentDirection = 3; isMoving = true; }

        if (movement.x != 0 || movement.y != 0) {
            float length = std::sqrt(movement.x * movement.x + movement.y * movement.y);
            movement.x /= length;
            movement.y /= length;
        }

        //  ОБРАБОТКА МЫШИ (НАПРАВЛЕНИЕ АТАКИ) 
        sf::Vector2i mousePixel = sf::Mouse::getPosition(window);
        sf::Vector2f mouseWorld = window.mapPixelToCoords(mousePixel, camera);

        // Вектор от героя к мыши
        sf::Vector2f toMouse = mouseWorld - hero.getPosition();
        float dx = toMouse.x;
        float dy = toMouse.y;

        // Определяем направление по мыши
        if (std::abs(dx) > std::abs(dy)) {
            // Горизонтальное направление
            if (dx > 0) currentDirection = 3; // Вправо
            else currentDirection = 2;        // Влево
        }
        else {
            // Вертикальное направление
            if (dy > 0) currentDirection = 0; // Вниз
            else currentDirection = 1;        // Вверх
        }

        //ОБРАБОТКА ЛКМ (АТАКА) 
        bool lmbPressed = sf::Mouse::isButtonPressed(sf::Mouse::Left);

        if (lmbPressed && !isAttacking) {
            isAttacking = true;
            attackFrame = 0;
            attackTimer = 0.f;
        }
        if (!lmbPressed) {
            isAttacking = false;
        }

        //  ДВИЖЕНИЕ И КОЛЛИЗИЯ
        if (isMoving) {
            sf::Vector2f oldPos = hero.getPosition();
            hero.move(movement.x * speed * deltaTime, 0);
            if (checkCollision(hero.getGlobalBounds())) hero.setPosition(oldPos);
            oldPos = hero.getPosition();
            hero.move(0, movement.y * speed * deltaTime);
            if (checkCollision(hero.getGlobalBounds())) hero.setPosition(oldPos);

            sf::FloatRect bounds = hero.getGlobalBounds();
            if (bounds.left < 0) hero.setPosition(0, hero.getPosition().y);
            if (bounds.top < 0) hero.setPosition(hero.getPosition().x, 0);
            if (bounds.left + bounds.width > WORLD_WIDTH) hero.setPosition(WORLD_WIDTH - bounds.width, hero.getPosition().y);
            if (bounds.top + bounds.height > WORLD_HEIGHT) hero.setPosition(hero.getPosition().x, WORLD_HEIGHT - bounds.height);
        }

        // === АНИМАЦИЯ ===
        if (isAttacking) {
            // Анимация атаки (2 кадра)
            attackTimer += deltaTime;
            if (attackTimer >= ATTACK_SPEED) {
                attackFrame = (attackFrame + 1) % 2;
                attackTimer = 0.f;
            }

            // Применяем анимацию атаки в направлении МЫШИ
            switch (currentDirection) {
            case 0: hero.setTexture(atkDown[attackFrame]); break;
            case 1: hero.setTexture(atkUp[attackFrame]); break;
            case 2: hero.setTexture(atkLeft[attackFrame]); break;
            case 3: hero.setTexture(atkRight[attackFrame]); break;
            }
        }
        else if (isMoving) {
            // Анимация ходьбы
            animationTimer += deltaTime;
            if (animationTimer >= animationSpeed) {
                currentFrame = (currentFrame + 1) % 4;
                animationTimer = 0.f;
                switch (currentDirection) {
                case 0: hero.setTexture(texturesDown[currentFrame]); break;
                case 1: hero.setTexture(texturesUp[currentFrame]); break;
                case 2: hero.setTexture(texturesLeft[currentFrame]); break;
                case 3: hero.setTexture(texturesRight[currentFrame]); break;
                }
            }
        }
        else {
            // Стоит на месте (1-й кадр)
            switch (currentDirection) {
            case 0: hero.setTexture(texturesDown[0]); break;
            case 1: hero.setTexture(texturesUp[0]); break;
            case 2: hero.setTexture(texturesLeft[0]); break;
            case 3: hero.setTexture(texturesRight[0]); break;
            }
        }

        camera.setCenter(hero.getPosition());

        //  ОТРИСОВКА МИРА 
        window.clear(sf::Color(20, 20, 20));
        window.setView(camera);

        // ПОЛ
        const int DRAW_STEP = 64;
        int startX = (int)(camera.getCenter().x / DRAW_STEP) * DRAW_STEP - 800;
        int startY = (int)(camera.getCenter().y / DRAW_STEP) * DRAW_STEP - 600;

        sf::Sprite tileFloor(texFloor);
        tileFloor.setScale(2.0f, 2.0f);

        for (int x = startX; x < startX + 1700; x += DRAW_STEP) {
            for (int y = startY; y < startY + 1300; y += DRAW_STEP) {
                tileFloor.setPosition((float)x, (float)y);
                window.draw(tileFloor);
            }
        }

        // СТЕНЫ
        for (auto& wall : walls) drawTiledTexture(window, texWall, wall.getGlobalBounds());

        // ГЕРОЙ
        window.draw(hero);

        // HUD 

        window.setView(window.getDefaultView());
        sf::Vector2u winSize = window.getSize();

        // 1. Фон HUD
        float hudScale = 6.0f;
        hudBg.setScale(hudScale, hudScale);

        // 2. Размеры фона
        float bgWidth = hudBg.getGlobalBounds().width;
        float bgHeight = hudBg.getGlobalBounds().height;

        // 3. Позиция фона
        hudBg.setPosition((winSize.x - bgWidth) / 2.f, winSize.y - bgHeight - 50);
        window.draw(hudBg);

        // 4. HP BAR
        float hpScale = 4.0f;
        hpBar.setScale(hpScale, hpScale);

        float hpX = 500; 
        float hpY = 650;   
        hpBar.setPosition(hpX, hpY);
        window.draw(hpBar);

        // 5. MP BAR
        float mpScale = 4.0f;
        mpBar.setScale(mpScale, mpScale);

        float mpX = 500;
        float mpY = 710;   
        mpBar.setPosition(mpX, mpY);
        window.draw(mpBar);

       // 6. XP BAR
        float xpScale = 4.0f;
        xpBar.setScale(xpScale, xpScale);

        float xpX = 495;
        float xpY = 760;
        xpBar.setPosition(xpX, xpY);
        window.draw(xpBar);

        // 7. Weapon BAR
        float weaponScale = 4.0f;
        weaponBar.setScale(weaponScale, weaponScale);

        float weaponX = 740;
        float weaponY = 715;
        weaponBar.setPosition(weaponX, weaponY);
        window.draw(weaponBar);

        // 8. Inventory BAR
        float invScale = 4.0f;
        invBar.setScale(invScale, invScale);

        float invX = 950;
        float invY = 690;
        invBar.setPosition(invX, invY);
        window.draw(invBar);

        window.display();
    }

    return 0;
}
