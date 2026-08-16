-- Greybox walker. Wait stops the commute; a yank tugs (slows) briefly.

local gfx <const> = playdate.graphics

local WIDTH <const> = 40
local HEIGHT <const> = 48
local YANK_FRAMES <const> = 14
local HAND_DX <const> = 12
local HAND_DY <const> = -28

Walker = {}
Walker.__index = Walker
Walker.WIDTH = WIDTH
Walker.HEIGHT = HEIGHT
Walker.HAND_DX = HAND_DX
Walker.HAND_DY = HAND_DY

function Walker.new()
    local self = setmetatable({}, Walker)
    self:reset()
    return self
end

function Walker:reset()
    self.waiting = false
    self.yankFrames = 0
    self.walkFrame = 0
end

function Walker:yank()
    self.yankFrames = YANK_FRAMES
end

function Walker:commuteScale()
    if self.yankFrames > 0 then
        return 0.25
    end
    if self.waiting then
        return 0
    end
    return 1
end

function Walker:update()
    if self.yankFrames > 0 then
        self.yankFrames -= 1
    end
    if self:commuteScale() > 0 then
        self.walkFrame += 1
    end
end

function Walker:draw(screenX, feetY)
    local x = screenX - WIDTH / 2
    local y = feetY - HEIGHT
    if (not self.waiting) and self.yankFrames == 0 and self.walkFrame % 16 >= 8 then
        y -= 1
    end
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRoundRect(x, y, WIDTH, HEIGHT, 3)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRoundRect(x, y, WIDTH, HEIGHT, 3)
    gfx.fillCircleAtPoint(x + WIDTH / 2, y + 10, 6)
    gfx.drawLine(x + 12, y + 24, x + 12, y + 40)
    gfx.drawLine(x + 28, y + 24, x + 28, y + 40)
end

function Walker:handScreen(screenX, feetY)
    return screenX + HAND_DX, feetY + HAND_DY
end
